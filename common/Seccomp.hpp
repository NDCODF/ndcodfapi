/* -*- Mode: C++; tab-width: 4; indent-tabs-mode: nil; c-basic-offset: 4 -*- */
/*
 * This file is part of the LibreOffice project.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */
#ifndef INCLUDED_SECCOMP_HPP
#define INCLUDED_SECCOMP_HPP

namespace Seccomp {
    enum Type { KIT, WSD };

    /// Lock-down a process hard - @returns true on success.
    bool lockdown(Type type);
};

#endif

/* vim:set shiftwidth=4 softtabstop=4 expandtab: */
